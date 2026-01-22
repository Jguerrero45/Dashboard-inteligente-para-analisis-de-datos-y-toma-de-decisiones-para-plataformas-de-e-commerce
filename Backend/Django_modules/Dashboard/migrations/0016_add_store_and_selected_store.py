# Generated migration: add Store model and selected_store on UserProfile
from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('Dashboard', '0015_alter_recomendacionia_impacto'),
    ]

    operations = [
        migrations.CreateModel(
            name='Store',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150)),
                ('api_url', models.URLField(max_length=500,
                 help_text='URL base de la API de la tienda')),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='stores', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-creado_en'],
            },
        ),
        migrations.AddField(
            model_name='userprofile',
            name='selected_store',
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='Dashboard.Store'),
        ),
    ]
