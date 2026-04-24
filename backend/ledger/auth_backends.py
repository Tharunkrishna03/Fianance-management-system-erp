from django.contrib.auth.backends import ModelBackend


class JewelFinanceModelBackend(ModelBackend):
    def user_can_authenticate(self, user):
        return super().user_can_authenticate(user)
