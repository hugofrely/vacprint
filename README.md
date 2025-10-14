# VacPrint

> **Note** : Projet codé à la va-vite pour un besoin personnel. Le code n'est pas parfait, mais ça marche !

## C'est quoi ?

Un petit outil web pour transformer les cartes VAC d'aérodromes en livrets imprimables. Parce que c'est quand même plus pratique d'avoir un livret bien plié qu'une pile de feuilles A4 qui volent partout dans le cockpit.

## Le problème

Les cartes VAC du SIA sont en A5. Si tu les imprimes direct, tu te retrouves avec plein de petites feuilles. L'idée c'est de les assembler sur du A4 en recto-verso pour faire soit :

- Un livret que tu plies en deux (compact et pratique)
- Des cartes individuelles que tu découpes (pour ton kneeboard)

## Ce que ça fait

- **Recherche directe sur le SIA** : tape LFMA, LFMV ou n'importe quel code OACI français, l'outil va chercher la VAC officielle tout seul
- **Upload manuel** : si t'as déjà le PDF, tu peux aussi l'uploader direct
- **Mode livret** : assemble les pages dans le bon ordre pour faire un vrai livret
- **Mode découpe** : organise les pages pour faire des cartes individuelles
- **100% local** : tout se passe dans ton navigateur, rien n'est envoyé sur un serveur

## Stack technique

- **Next.js 15** avec App Router
- **TypeScript** parce que bon...
- **Tailwind CSS** pour le style
- **pdf-lib** pour manipuler les PDFs
- **lucide-react** pour les icônes

## Installation

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) et c'est parti.

## Comment ça marche

### Récupération des VAC depuis le SIA

L'API route `/api/fetch-vac` essaie plusieurs dates AIRAC (cycles de 28 jours) pour trouver la bonne URL :

```
https://www.sia.aviation-civile.gouv.fr/media/dvd/eAIP_DD_MMM_YYYY/Atlas-VAC/PDF_AIPparSSection/VAC/AD/AD-2.LFXX.pdf
```

### Formatage des PDFs

Le fichier `lib/pdfFormatter.ts` fait tout le boulot :

**Mode Livret** : Pour un livret de 8 pages, l'ordre d'impression est :

- Feuille 1 recto : [8][1] → verso : [2][7]
- Feuille 2 recto : [6][3] → verso : [4][5]

Comme ça quand tu plies, t'as 1,2,3,4,5,6,7,8 dans l'ordre.

**Mode Découpe** : Les pages alternent gauche/droite :

- Page 1 : [vide][page 1]
- Page 2 : [page 8][vide]
- Page 3 : [vide][page 2]
- etc.

Tu plies, tu coupes le long du pli, et t'as tes cartes individuelles.

## Limitations connues

- Marche que pour les codes OACI français (LFxx)
- Si le SIA change son URL pattern, faudra mettre à jour
- Le calcul AIRAC est approximatif (devrait tenir jusqu'à ce que le SIA change de structure)
- Pas de preview du PDF avant téléchargement

## Pourquoi ce projet existe

J'en avais marre de galérer à imprimer mes VAC. J'ai codé ça, ça marche, c'est open source, profitez-en.

## Contribution

Si t'as des idées d'amélioration ou que tu trouves des bugs, go PR ou issue. Le code est pas parfait mais il fait le job.

## License

MIT - Fais ce que tu veux avec

## Mentions

- Merci au SIA pour les données VAC
- Merci à pdf-lib pour rendre la manipulation de PDF facile

---

_Fait avec ❤️ (et un peu de café) pour la communauté aéro_
