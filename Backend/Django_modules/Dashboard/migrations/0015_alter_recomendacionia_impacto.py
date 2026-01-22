from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Dashboard', '0014_userprofile'),
    ]

    operations = [
        migrations.AlterField(
            model_name='recomendacionia',
            name='impacto',
            field=models.TextField(
                blank=True, help_text='Impacto estimado (opcional)'),
        ),
    ]
