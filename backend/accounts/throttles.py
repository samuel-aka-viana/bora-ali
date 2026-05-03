import ipaddress

from django.conf import settings
from rest_framework.throttling import ScopedRateThrottle

_DEFAULT_EXEMPT = ["127.0.0.1/32", "::1/128", "172.16.0.0/12", "192.168.0.0/16"]


def _exempt_networks():
    cidrs = getattr(settings, "THROTTLE_EXEMPT_CIDRS", _DEFAULT_EXEMPT)
    return [ipaddress.ip_network(c) for c in cidrs]


def _get_client_ip(request) -> str:
    """Return the rightmost untrusted IP from X-Forwarded-For.

    Prevents XFF spoofing: attacker cannot inject a trusted IP as the first
    entry because we walk the chain from right (closest proxy) to left.
    Falls back to REMOTE_ADDR when XFF is absent.
    """
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if xff:
        trusted = _exempt_networks()
        for ip_str in reversed([ip.strip() for ip in xff.split(",")]):
            try:
                ip = ipaddress.ip_address(ip_str)
                if not any(ip in net for net in trusted):
                    return ip_str
            except ValueError:
                continue
    return request.META.get("REMOTE_ADDR", "")


class AuthRateThrottle(ScopedRateThrottle):
    scope = "auth"

    def allow_request(self, request, view):
        ip_str = _get_client_ip(request)
        try:
            ip = ipaddress.ip_address(ip_str)
            if any(ip in net for net in _exempt_networks()):
                return True
        except ValueError:
            pass
        return super().allow_request(request, view)
