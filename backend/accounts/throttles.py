import ipaddress

from django.conf import settings
from rest_framework.throttling import ScopedRateThrottle

_DEFAULT_EXEMPT = ["127.0.0.1/32", "::1/128", "172.16.0.0/12", "192.168.0.0/16"]


def _exempt_networks():
    cidrs = getattr(settings, "THROTTLE_EXEMPT_CIDRS", _DEFAULT_EXEMPT)
    return [ipaddress.ip_network(c) for c in cidrs]


class AuthRateThrottle(ScopedRateThrottle):
    scope = "auth"

    def allow_request(self, request, view):
        xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
        ip_str = xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR", "")
        try:
            ip = ipaddress.ip_address(ip_str)
            if any(ip in net for net in _exempt_networks()):
                return True
        except ValueError:
            pass
        return super().allow_request(request, view)
