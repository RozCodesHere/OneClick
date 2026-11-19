from pathlib import PurePosixPath
from uuid import uuid4

import cloudinary.uploader
import cloudinary.utils

from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible


@deconstructible
class CloudinaryImageStorage(Storage):

    def _save(self, name, content):
        path = PurePosixPath(name)

        folder = "" if str(path.parent) == "." else str(path.parent)
        public_id = f"{folder}/{uuid4().hex}" if folder else uuid4().hex

        if hasattr(content, "seek"):
            content.seek(0)

        result = cloudinary.uploader.upload(
            content,
            public_id=public_id,
            resource_type="image",
            overwrite=False,
        )

        return f"{result['public_id']}.{result['format']}"

    def exists(self, name):
        return False

    def url(self, name):
        path = PurePosixPath(name)
        public_id = str(path.with_suffix(""))
        extension = path.suffix.lstrip(".")

        url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            format=extension or None,
            secure=True,
            resource_type="image",
        )

        return url

    def delete(self, name):
        path = PurePosixPath(name)
        public_id = str(path.with_suffix(""))

        cloudinary.uploader.destroy(
            public_id,
            resource_type="image",
        )