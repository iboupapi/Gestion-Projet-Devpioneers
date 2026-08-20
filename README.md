# DevPioneers — Plateforme de gestion de projets

Plateforme web permettant à l'agence **DevPioneers** de gérer ses projets clients : suivi
d'avancement, messagerie en temps réel, validation de maquettes, partage d'images, et
notifications par email. Trois rôles : **Admin**, **Développeur**, **Client**.

---

## Sommaire

- [Stack technique](#stack-technique)
- [Fonctionnalités](#fonctionnalités)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Installation — Backend](#installation--backend)
- [Installation — Frontend](#installation--frontend)
- [Variables d'environnement](#variables-denvironnement)
- [Comptes et rôles](#comptes-et-rôles)
- [Scripts utiles](#scripts-utiles)
- [Sécurité](#sécurité)
- [Limites connues](#limites-connues)

---

## Stack technique

**Backend**
- Node.js / Express
- PostgreSQL + [Prisma ORM](https://www.prisma.io/) (v6)
- Socket.io (chat et notifications temps réel)
- JWT en cookie `httpOnly` (authentification)
- Multer + Sharp (upload et compression d'images)
- Resend (envoi d'emails transactionnels)
- express-rate-limit (protection brute-force)

**Frontend**
- React + Vite
- Tailwind CSS
- Axios (client HTTP, `withCredentials: true`)
- Socket.io-client

---

## Fonctionnalités

- **Authentification par invitation** : l'admin crée un compte (client ou développeur), un
  email d'invitation est envoyé, l'utilisateur définit son mot de passe via un lien à usage
  unique (expire après 7 jours).
- **Gestion de projets** : statuts (`EN_ATTENTE`, `EN_COURS`, `EN_REVISION`, `LIVRE`,
  `MAINTENANCE`, `TERMINE`), assignation de développeurs, échéances.
- **Messagerie temps réel par projet** :
  - Texte, lien ou pièce jointe (image/fichier)
  - Un envoi peut être marqué **maquette** (fichier ou lien) → le client peut la valider ou
    l'invalider avec justification obligatoire
  - Un lien peut être catégorisé **lien de test** ou **lien définitif**
  - Diffusion instantanée via websockets (aucun rechargement de page nécessaire)
  - Aperçu plein écran des images envoyées (façon WhatsApp)
- **Galerie d'images par projet** : le client peut ajouter des images à tout moment (hors
  messagerie) ; les développeurs peuvent les consulter et les télécharger.
- **Notifications email** : nouvel utilisateur invité, nouveau message dans un projet.
- **Compression automatique des images** à l'upload (redimensionnement + compression, PNG et
  JPEG gérés séparément pour préserver la transparence).
- **Responsive** : sidebar en tiroir sur mobile, grilles empilées, chat et galerie adaptés aux
  petits écrans.

---

## Structure du projet

```
Plateforme_devpioneers/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── db/
│   │   │   └── store.js            # couche d'accès aux données (via Prisma)
│   │   ├── middleware/
│   │   │   └── auth.js             # vérification du cookie JWT
│   │   ├── routes/
│   │   │   ├── auth.routes.js      # login, logout, invitations
│   │   │   ├── users.routes.js     # création d'utilisateurs (admin)
│   │   │   ├── projects.routes.js  # CRUD projets, assignation
│   │   │   ├── messages.routes.js  # messagerie temps réel + validation maquettes
│   │   │   └── assets.routes.js    # galerie d'images du projet
│   │   ├── utils/
│   │   │   ├── auth.js             # signToken/verifyToken, uuid
│   │   │   ├── projectAccess.js    # contrôle d'accès + sérialisation
│   │   │   ├── mailer.js           # envoi d'emails (Resend)
│   │   │   ├── imageProcessing.js  # compression via sharp
│   │   │   └── uploadHelpers.js    # sauvegarde des fichiers uploadés
│   │   └── index.js                # point d'entrée (Express + Socket.io)
│   └── uploads/                    # fichiers uploadés (images, pièces jointes)
│
└── frontend/
    └── src/
        ├── api/
        │   ├── client.js           # instance axios
        │   └── socket.js           # client Socket.io
        ├── components/
        │   ├── ChatThread.jsx
        │   ├── ProjectAssets.jsx
        │   ├── DashboardLayout.jsx
        │   ├── StatusBadge.jsx
        │   └── Logo.jsx
        ├── context/
        │   └── AuthContext.jsx
        └── pages/
            ├── Login.jsx
            ├── AcceptInvitation.jsx
            ├── AdminDashboard.jsx
            ├── DevDashboard.jsx
            └── ClientDashboard.jsx
```

---

## Prérequis

- Node.js 18+
- PostgreSQL (local ou distant)
- Un compte [Resend](https://resend.com) (optionnel en dev — sans clé API, les emails sont
  simplement affichés dans la console au lieu d'être envoyés)

---

## Installation — Backend

```bash
cd backend
npm install

# Créer la base PostgreSQL
psql -U postgres -c "CREATE DATABASE devpioneers;"
```

Créer un fichier `.env` dans `backend/` (voir [Variables d'environnement](#variables-denvironnement)).

```bash
# Appliquer le schéma Prisma
npx prisma migrate dev

# Créer le compte admin
node prisma/seed.js

# Démarrer le serveur
npm run dev
```

Le serveur écoute par défaut sur `http://localhost:4000`.

---

## Installation — Frontend

```bash
cd frontend
npm install
```

Créer un fichier `.env` dans `frontend/` :

```
VITE_API_URL=http://localhost:4000
```

```bash
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

---

## Variables d'environnement

### Backend (`backend/.env`)

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | `postgresql://postgres:motdepasse@localhost:5432/devpioneers?schema=public` |
| `JWT_SECRET` | Secret de signature des tokens JWT | une chaîne longue et aléatoire |
| `PORT` | Port du serveur backend | `4000` |
| `NODE_ENV` | Environnement (`development` / `production`) | `development` |
| `FRONTEND_URL` | Origine(s) autorisée(s) en CORS (séparées par des virgules) | `http://localhost:5173` |
| `RESEND_API_KEY` | Clé API Resend (optionnel en dev) | `re_...` |
| `EMAIL_FROM` | Adresse d'expédition des emails | `DevPioneers <onboarding@resend.dev>` |

### Frontend (`frontend/.env`)

| Variable | Description | Exemple |
|---|---|---|
| `VITE_API_URL` | URL du backend (pour la connexion websocket) | `http://localhost:4000` |

⚠️ En production, si le frontend et le backend sont sur des domaines totalement différents (pas
seulement des ports différents), le cookie de session devra passer en
`sameSite: "none"` + `secure: true` (HTTPS obligatoire) — voir `middleware`/`routes/auth.routes.js`.

---

## Comptes et rôles

| Rôle | Création | Permissions clés |
|---|---|---|
| **Admin** | Compte de seed (`prisma/seed.js`) | Crée clients/développeurs, assigne les projets, clôture les projets |
| **Développeur** | Créé par l'admin, invitation par email | Voit ses projets assignés, envoie messages/maquettes/liens, consulte la galerie client |
| **Client** | Créé par l'admin, invitation par email | Suit ses projets, valide/invalide les maquettes, ajoute des images à la galerie |

Chaque nouveau compte reçoit un lien d'invitation (valable 7 jours) pour définir son mot de
passe et activer son accès.

---

## Scripts utiles

```bash
# Backend
npm run dev              # démarre le serveur en mode développement
npx prisma studio         # interface graphique pour explorer la base
npx prisma migrate dev    # applique une nouvelle migration
node prisma/seed.js        # (ré)crée le compte admin

# Frontend
npm run dev               # démarre le serveur de développement Vite
npm run build              # build de production
```

---

## Sécurité

- Mots de passe hachés avec `bcryptjs`
- Session gérée via cookie **httpOnly** (le token JWT n'est jamais accessible en JavaScript
  côté navigateur)
- Rate limiting sur `/api/auth/login` (10 tentatives / 15 min) et les routes d'invitation
- CORS restreint aux origines déclarées dans `FRONTEND_URL`
- Upload de fichiers limité à 10 Mo, images uniquement pour la galerie projet
- Chaque route de projet vérifie l'appartenance de l'utilisateur (client propriétaire,
  développeur assigné, ou admin) avant tout accès

---

## Limites connues

- Le mode test de Resend (sans domaine vérifié) ne permet d'envoyer des emails qu'à l'adresse
  du compte Resend lui-même — un domaine doit être vérifié pour notifier de vrais utilisateurs.
- Pas encore de tests automatisés.
- Pas de pagination sur l'historique des messages (tout l'historique est chargé à l'ouverture
  du chat).