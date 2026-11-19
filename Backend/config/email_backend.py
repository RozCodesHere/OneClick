
import json
import urllib.request
from urllib.error import HTTPError, URLError

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend


class AppsScriptEmailBackend(BaseEmailBackend):

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        url = settings.GOOGLE_APPS_SCRIPT_URL
        secret = settings.ONECLICK_SECRET

        if not url or not secret:
            raise ValueError("Email service configuration is missing.")

        sent_count = 0

        for message in email_messages:
            recipients = message.recipients()

            if not recipients:
                continue

            for recipient in recipients:
                payload = {
                    "secret": secret,
                    "to": recipient,
                    "subject": message.subject,
                    "message": message.body,
                }

                request_data = json.dumps(payload).encode("utf-8")

                request = urllib.request.Request(
                    url,
                    data=request_data,
                    headers={
                        "Content-Type": "application/json"
                    },
                    method="POST",
                )

                try:
                    with urllib.request.urlopen(
                        request,
                        timeout=30
                    ) as response:

                        result = json.loads(
                            response.read().decode("utf-8")
                        )

                        if not result.get("success"):
                            raise RuntimeError(
                                "Email service rejected the request."
                            )

                        sent_count += 1

                except (HTTPError, URLError, TimeoutError) as error:
                    if not self.fail_silently:
                        raise error

        return sent_count
