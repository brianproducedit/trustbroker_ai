"""Deterministic Policy Engine for TrustBroker AI.

Enforces pure, verifiable access and state rules:
"Can this user perform this action on this entity right now?"
"""
from dataclasses import dataclass
from typing import Optional
from app.models.contract import Contract, ContractStatus, ContractVisibility
from app.models.marketplace import Application, ApplicationStatus
from app.models.milestone import Milestone, MilestoneStatus, PaymentStatus
from app.models.user import UserProfile


@dataclass(frozen=True)
class PolicyResult:
    allowed: bool
    reason: str = ""

    def __bool__(self) -> bool:
        return self.allowed


class PolicyEngine:
    @staticmethod
    def is_party(user: UserProfile, contract: Contract) -> bool:
        return (
            contract.client_id == user.id
            or contract.freelancer_id == user.id
            or (contract.freelancer_email and contract.freelancer_email.lower() == user.email.lower())
        )

    @staticmethod
    def is_client(user: UserProfile, contract: Contract) -> bool:
        return contract.client_id == user.id

    @staticmethod
    def is_freelancer(user: UserProfile, contract: Contract) -> bool:
        return (
            contract.freelancer_id == user.id
            or (contract.freelancer_email and contract.freelancer_email.lower() == user.email.lower())
        )

    @classmethod
    def can_edit_contract(cls, user: UserProfile, contract: Contract) -> PolicyResult:
        """Only the client can edit, and only when the contract is in draft status."""
        if not cls.is_client(user, contract):
            return PolicyResult(False, "Only the client who created the contract can modify it.")
        if contract.status != ContractStatus.DRAFT:
            return PolicyResult(False, f"Cannot modify contract in '{contract.status.value}' status. Only drafts can be edited.")
        return PolicyResult(True)

    @classmethod
    def can_publish(cls, user: UserProfile, contract: Contract) -> PolicyResult:
        """Client only; contract must still be a private draft."""
        if not cls.is_client(user, contract):
            return PolicyResult(False, "Only the client can publish this contract as an open listing.")
        if contract.status != ContractStatus.DRAFT:
            return PolicyResult(False, f"Cannot publish contract in '{contract.status.value}' status. Only drafts can be published.")
        return PolicyResult(True)

    @classmethod
    def can_apply(cls, user: UserProfile, contract: Contract) -> PolicyResult:
        """Freelancers who are not the client may apply to an open listing."""
        if cls.is_client(user, contract):
            return PolicyResult(False, "The client cannot apply to their own contract.")
        if contract.status != ContractStatus.OPEN:
            return PolicyResult(False, f"Applications are only accepted on open contracts (current: '{contract.status.value}').")
        if contract.visibility != ContractVisibility.OPEN.value:
            return PolicyResult(False, "This contract is not an open listing.")
        return PolicyResult(True)

    @classmethod
    def can_award(
        cls,
        user: UserProfile,
        contract: Contract,
        application: Optional[Application] = None,
        freelancer: Optional[UserProfile] = None,
    ) -> PolicyResult:
        """Client only; contract must be open; application must be eligible; payout email required."""
        if not cls.is_client(user, contract):
            return PolicyResult(False, "Only the client can award this contract.")
        if contract.status != ContractStatus.OPEN:
            return PolicyResult(False, f"Cannot award a contract that is not open (current: '{contract.status.value}').")
        if application is not None:
            if application.contract_id != contract.id:
                return PolicyResult(False, "Application does not belong to this contract.")
            if application.status in (
                ApplicationStatus.REJECTED.value,
                ApplicationStatus.WITHDRAWN.value,
            ):
                return PolicyResult(False, f"Cannot award an application in '{application.status}' status.")
        if freelancer is not None and not (freelancer.paypal_payout_email or "").strip():
            return PolicyResult(
                False,
                "The freelancer must add a PayPal payout email on their profile before they can be awarded.",
            )
        return PolicyResult(True)

    @classmethod
    def can_accept_contract(cls, user: UserProfile, contract: Contract) -> PolicyResult:
        """Must be a contracted party, and contract must be draft, awarded, or pending_acceptance."""
        if not cls.is_party(user, contract):
            return PolicyResult(False, "You are not an authorized party on this contract.")
        if contract.status not in (
            ContractStatus.DRAFT,
            ContractStatus.AWARDED,
            ContractStatus.PENDING_ACCEPTANCE,
        ):
            return PolicyResult(False, f"Cannot accept contract in '{contract.status.value}' status.")
        return PolicyResult(True)

    @classmethod
    def can_cancel_contract(cls, user: UserProfile, contract: Contract) -> PolicyResult:
        """Client can cancel draft or pending contract, or either party if in draft."""
        if not cls.is_party(user, contract):
            return PolicyResult(False, "You are not an authorized party on this contract.")
        if contract.status in (ContractStatus.COMPLETED, ContractStatus.CANCELLED):
            return PolicyResult(False, f"Contract is already {contract.status.value}.")
        if contract.status == ContractStatus.ACTIVE and not cls.is_client(user, contract):
            return PolicyResult(False, "Only the client can initiate cancellation on an active contract.")
        return PolicyResult(True)

    @classmethod
    def can_create_payment(
        cls,
        user: UserProfile,
        contract: Contract,
        milestone: Optional[Milestone] = None,
    ) -> PolicyResult:
        """Client only, contract must be active, payment not already completed/staged."""
        return cls.can_fund(user, contract, milestone)

    @classmethod
    def can_fund(
        cls,
        user: UserProfile,
        contract: Contract,
        milestone: Optional[Milestone] = None,
    ) -> PolicyResult:
        """Client funds a milestone only after the contract is active."""
        if not cls.is_client(user, contract):
            return PolicyResult(False, "Only the client can fund a milestone.")
        if contract.status != ContractStatus.ACTIVE:
            return PolicyResult(
                False,
                f"Contract must be active before funding a milestone (current: '{contract.status.value}').",
            )
        if milestone is None:
            return PolicyResult(False, "A milestone is required to fund.")
        if milestone.payment_status in (
            PaymentStatus.STAGED_IN_SANDBOX,
            PaymentStatus.RELEASE_AUTHORIZED,
            PaymentStatus.RELEASED,
        ):
            return PolicyResult(
                False,
                f"Milestone is already funded or released (status: '{milestone.payment_status.value}').",
            )
        return PolicyResult(True)

    @classmethod
    def can_submit_delivery(
        cls,
        user: UserProfile,
        contract: Contract,
        milestone: Milestone,
    ) -> PolicyResult:
        """Freelancer only, contract active or pending, milestone must be in progress or revision requested."""
        if not cls.is_freelancer(user, contract):
            return PolicyResult(False, "Only the assigned freelancer can submit deliverable evidence.")
        if contract.status == ContractStatus.CANCELLED:
            return PolicyResult(False, "Cannot submit deliverables on a cancelled contract.")
        if contract.status not in (ContractStatus.ACTIVE, ContractStatus.IN_VERIFICATION):
            return PolicyResult(
                False,
                f"Deliveries can only be submitted on an active contract (current: '{contract.status.value}').",
            )
        if milestone.status in (MilestoneStatus.VERIFIED, MilestoneStatus.SETTLED):
            return PolicyResult(False, f"Milestone is already {milestone.status.value}.")
        return PolicyResult(True)

    @classmethod
    def can_trigger_verification(
        cls,
        user: UserProfile,
        contract: Contract,
        milestone: Milestone,
    ) -> PolicyResult:
        """Contract party can verify, milestone must have submissions."""
        if not cls.is_party(user, contract):
            return PolicyResult(False, "Only contract parties can run AI verification.")
        if milestone.status in (MilestoneStatus.PENDING, MilestoneStatus.IN_PROGRESS):
            return PolicyResult(False, "Cannot run verification before deliverable evidence is submitted.")
        return PolicyResult(True)

    @classmethod
    def can_authorize_release(
        cls,
        user: UserProfile,
        contract: Contract,
        milestone: Milestone,
    ) -> PolicyResult:
        """Client only, milestone must be verified, payment must be staged in sandbox."""
        return cls.can_release_payout(user, contract, milestone)

    @classmethod
    def can_release_payout(
        cls,
        user: UserProfile,
        contract: Contract,
        milestone: Milestone,
        freelancer: Optional[UserProfile] = None,
    ) -> PolicyResult:
        """Client only; milestone verified; funds staged; freelancer payout email present."""
        if not cls.is_client(user, contract):
            return PolicyResult(False, "Only the client can authorize payout release.")
        if milestone.status != MilestoneStatus.VERIFIED:
            return PolicyResult(
                False,
                f"Milestone must be verified before release (current: '{milestone.status.value}').",
            )
        if milestone.payment_status not in (
            PaymentStatus.STAGED_IN_SANDBOX,
            PaymentStatus.RELEASE_AUTHORIZED,
        ):
            return PolicyResult(
                False,
                f"Milestone must be funded in PayPal before payout (current: '{milestone.payment_status.value}').",
            )
        if freelancer is not None and not (freelancer.paypal_payout_email or "").strip():
            return PolicyResult(False, "Freelancer PayPal payout email is required before release.")
        return PolicyResult(True)

    @classmethod
    def can_request_revision(
        cls,
        user: UserProfile,
        contract: Contract,
        milestone: Milestone,
    ) -> PolicyResult:
        """Client only, milestone submitted or verifying/revision requested."""
        if not cls.is_client(user, contract):
            return PolicyResult(False, "Only the client can request milestone revisions.")
        if milestone.status in (MilestoneStatus.SETTLED, MilestoneStatus.PENDING):
            return PolicyResult(False, f"Cannot request revisions when milestone is '{milestone.status.value}'.")
        return PolicyResult(True)
