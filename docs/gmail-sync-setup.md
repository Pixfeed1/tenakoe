# Configuration de la synchronisation Gmail (détection des réponses)

## 1. Générer le token de sécurité

```bash
openssl rand -hex 32
```

Ajouter le résultat dans `.env` sur le serveur :

```
GMAIL_SYNC_TOKEN=<le-token-généré>
```

Redémarrer le service après modification.

## 2. Installer le cron

```bash
crontab -e
```

Ajouter la ligne (exécution toutes les 5 minutes) :

```
*/5 * * * * curl -s -X POST "https://tenakoe.pixfeed.net/api/gmail/sync?token=<le-token-généré>" > /dev/null 2>&1
```

## 3. Scopes OAuth requis

Le scope `gmail.readonly` est déjà inclus dans la configuration OAuth de Kiwi. Aucune action supplémentaire n'est nécessaire pour les utilisatrices déjà connectées.

Si une utilisatrice rencontre une erreur de permission, elle doit :
1. Aller dans **Paramètres → Intégrations**
2. Cliquer **Déconnecter** puis **Reconnecter** son compte Gmail
3. Accepter les permissions demandées (lecture des mails)

## 4. Fonctionnement

- Le cron appelle `POST /api/gmail/sync?token=...` toutes les 5 minutes
- Pour chaque utilisatrice ayant un compte Gmail connecté :
  - Premier run : initialisation (aucun rattrapage historique)
  - Runs suivants : détecte les nouveaux mails dans la boîte de réception
  - Ne traite QUE les réponses aux mails envoyés depuis Kiwi (matching par threadId)
  - Crée une alerte (cloche) pour la chargée expéditrice
  - Met à jour le statut de la transmission en "Répondu"
- Les erreurs d'une boîte ne bloquent pas les autres
- Maximum 50 messages traités par utilisatrice par run

## 5. Vérification

Après installation, vérifier manuellement :

```bash
curl -X POST "https://tenakoe.pixfeed.net/api/gmail/sync?token=<le-token>" | jq
```

Réponse attendue :

```json
{
  "synced": 2,
  "replies": 0,
  "errors": []
}
```
