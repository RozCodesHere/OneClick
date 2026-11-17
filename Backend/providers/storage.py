
from pathlib import Path

from django.conf import settings
from django.core.files.storage import FileSystemStorage


class PrivateKYCStorage(FileSystemStorage):

    def __init__(self, *args, **kwargs):
        private_location = Path(settings.BASE_DIR) / "private_media"

        super().__init__(
            location=private_location,
            base_url=None,
            *args,
            **kwargs,
        )

    def url(self, name):
        raise ValueError(
            "Private KYC documents cannot be accessed through public URLs."
        )