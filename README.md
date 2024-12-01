# advent_of_code_template

Template Advent of Code pour Typescript et/ou Rust

## Contexte


Advent of code est évènement qui propose un calendrier de l'avent de programmation avec un problème par jour décomposé en 2 parties de difficultés croissante.

Chaque partie rapport une étoile et le "but" est d'avoir les 50 étoiles.

### Objectif 

Le template propose un "modèle" pour faire les différentes année du projet advent of code que ça soit en TS ou Rust et ainsi partir "sur de bonnes bases"

### Préparation d'une année 

Pour commencer une année, il suffit de faire un nouveau repo à partir du source et changer les années dans les fichiers package.json ou cargo.toml (suivant ce que vous voulez faire)

## Typescript

Pour la partie Typescript, il faut node d'installé et plutôt VSCode (car des launcher)


#### Mise en place
 * cloner le répo mis en place pour la préparation de l'année
 * npm i
 * Si vs code :
   * se mettre sur le fichier "day_template.ts"
   * utiliser le "Launch current file" de vs code et vous devriez avoir l'affichage courant :
```console
[STARTING] Day 99
[TEST][PART 1] Running
[TEST][PART 1] No data file found
    Uncaught Error Error: No data found for day 99
```

L'erreur est normale, car il ne trouve pas de JDD pour le jour 99 (pour les tests)

### Logique

Chaque jour va être résolu par un ensemble :
- day_[xxx].ts : le code pour résoudre
- data/day_[xxx].dat : le jdd personnel
- data/day_[xxx]_test.dat : le jdd exemple fourni pour tester l'algo
- data/day_[xxx]_2_test.dat : (optionel dépend des jours) le jdd exemple fourni pour tester l'algo pour la partie 2


### Principe de résolution

L'idée est de chaque jour (ou la veille) de :
* copier le fichier "day_template.ts" en le renommat en "day_[xxx].ts" (exemple day_01.ts).
* ouvrir le nouveau fichier et positionner à la dernière ligne "bon jour" dans la fonction run
* mettre le jeu de donnée de test dans : data/day_[xxx]_test.dat (ou .txt) - exemple data/day_1_test.dat
* mettre le jeu "à vous" dans : data/day_[xxx].dat - exemple data/day_1.dat

Après comme le problème est souvent découpé en un pb de "parsing", il faut implémenter parse et/ou solve.



### Petit tips

##### Lancements partiels 

Il est possible de lancer uniquement la partie TEST (jdd de test) ou la partie RUN (jdd de perso) et/ou uniquement la partie 1 ou la partie 2 en jouant sur les paramètres passés à la fonction "run" du fichier courant.

##### Checker les résultats

Il est possible d'automatiser l'affichage des resultats en utilisant la fonction "logger.result".

```java
if(part === Part.PART1){
  const result = fct_calc_algo_part1(data)
  logger.result(value_found,[123/* résultat attendu pour le test */, 34440 /*résultat pour le vrai run */]);
}
else {
  const result = fct_calc_algo_part2(data)
  logger.result(value_found,[4845/* résultat attendu pour le test */, 2334949 /*résultat pour le vrai run */]);
}
```

### Après avoir trouvé / fini la journée

Un fois la journée terminée, il vaut mieux déplacer le fichier dans history et de l'ajouter à "day_all.ts".

Ainsi en lançant le fichier "day_all.ts", il est possible de relancer tout depuis le début.
