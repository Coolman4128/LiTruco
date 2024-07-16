# Generated by Django 5.0.6 on 2024-07-16 18:07

import django.db.models.deletion
import games.models
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Card',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.CharField(max_length=3)),
                ('suit', models.CharField(max_length=20)),
                ('image', models.ImageField(upload_to='cards/')),
            ],
        ),
        migrations.CreateModel(
            name='Deck',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cards', models.JSONField(default=games.models.generateDeck)),
                ('index', models.IntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='Board',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('trickNum', models.IntegerField(default=0)),
                ('pointWorth', models.IntegerField(default=1)),
                ('cardsPlayed', models.JSONField(default=dict)),
                ('trump', models.CharField(default=None, max_length=255, null=True)),
                ('at11', models.BooleanField(default=False)),
                ('blind', models.BooleanField(default=False)),
                ('deck', models.ForeignKey(default=games.models.newDeck, on_delete=django.db.models.deletion.CASCADE, to='games.deck')),
            ],
        ),
        migrations.CreateModel(
            name='Game',
            fields=[
                ('id', models.CharField(default=games.models.generateGameCode, max_length=8, primary_key=True, serialize=False)),
                ('players', models.JSONField(default=dict)),
                ('teams', models.JSONField(default=dict)),
                ('board', models.ForeignKey(default=games.models.newBoard, on_delete=django.db.models.deletion.CASCADE, to='games.board')),
            ],
        ),
        migrations.CreateModel(
            name='Player',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(max_length=255)),
                ('isTurn', models.BooleanField(default=False)),
                ('hand', models.JSONField(default=dict)),
                ('user', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Team',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('points', models.IntegerField(default=0)),
                ('tricksWon', models.IntegerField(default=0)),
                ('calledTruco', models.BooleanField(default=False)),
                ('player1', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='player1', to='games.player')),
                ('player2', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='player2', to='games.player')),
            ],
        ),
    ]