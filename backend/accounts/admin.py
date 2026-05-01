from config.admin_site import site as admin_site
from django.contrib.auth.admin import GroupAdmin, UserAdmin
from django.contrib.auth.models import Group, User

admin_site.register(User, UserAdmin)
admin_site.register(Group, GroupAdmin)
