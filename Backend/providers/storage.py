
from io import BytesIO
from pathlib import PurePosixPath
from time import time
from urllib.request import urlopen
from uuid import uuid4

import cloudinary.uploader
import cloudinary.utils

from django.core.files import File
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

@deconstructible
class PrivateKYCStorage(Storage):

    def _save(self, name, content):
        path = PurePosixPath(name)

        folder = "" if str(path.parent) == "." else str(path.parent)

        if folder:
            public_id = f"{folder}/{uuid4().hex}"
        else:
            public_id = uuid4().hex

        if hasattr(content, "seek"):
            content.seek(0)

        result = cloudinary.uploader.upload(
            content,
            public_id=public_id,
            resource_type="image",
            type="authenticated",
            overwrite=False,
        )

        return f"{result['public_id']}.{result['format']}"

    def _open(self, name, mode="rb"):
        path = PurePosixPath(name)

        public_id = str(path.with_suffix(""))
        file_format = path.suffix.lstrip(".")

        download_url = cloudinary.utils.private_download_url(
            public_id,
            file_format,
            resource_type="image",
            type="authenticated",
            expires_at=int(time()) + 60,
        )

        with urlopen(download_url, timeout=30) as response:
            file_content = BytesIO(response.read())

        return File(file_content, name=name)

    def exists(self, name):
        return False

    def delete(self, name):
        path = PurePosixPath(name)
        public_id = str(path.with_suffix(""))

        cloudinary.uploader.destroy(
            public_id,
            resource_type="image",
            type="authenticated",
        )

    def url(self, name):
        raise ValueError(
            "Private KYC documents cannot be accessed through public URLs."
        )
