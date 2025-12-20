from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Dashboard', '0012_remove_costo_utilidad_from_productos'),
    ]

    operations = [
        migrations.AddField(
            model_name='productos',
            name='costo',
            field=models.DecimalField(
                null=True, blank=True, max_digits=12, decimal_places=2),
        ),
    ]
