# -*- coding: utf-8 -*-
"""${message}"""
from alembic import op
import sqlalchemy as sa

${imports}

# revision identifiers, used by Alembic.
revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends = ${repr(depends)}

def upgrade() -> None:
    ${upgrades}

def downgrade() -> None:
    ${downgrades}
