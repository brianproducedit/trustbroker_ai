from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel
from alembic import context

# Import settings and all models so SQLModel.metadata is populated
from app.config import settings
import app.models  # noqa: F401

# Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Overwrite sqlalchemy.url with the database_url from application settings.
# Escape % to %% to prevent configparser interpolation errors with URL-encoded passwords.
safe_url = settings.sqlalchemy_database_url.replace("%", "%%")
config.set_main_option("sqlalchemy.url", safe_url)

# Target metadata for autogenerate migrations
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = settings.sqlalchemy_database_url


    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
