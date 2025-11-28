from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model


class RegistrationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('register')

    def test_register_user(self):
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'ComplexPass123!',
            'password2': 'ComplexPass123!'
        }
        response = self.client.post(self.url, data, format='json')
        self.assertIn(response.status_code, (201, 200))

        User = get_user_model()
        self.assertTrue(User.objects.filter(username='testuser').exists())
