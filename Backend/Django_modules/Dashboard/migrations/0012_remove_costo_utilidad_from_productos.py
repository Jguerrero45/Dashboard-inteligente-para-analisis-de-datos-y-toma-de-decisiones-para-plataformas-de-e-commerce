from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('Dashboard', '0011_assign_display_ids'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='productos',
            name='costo',
        ),
        migrations.RemoveField(
            model_name='productos',
            name='utilidad',
        ),
    ]
