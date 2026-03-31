let alunos = [
  [1, 2, 4],
  [4 ,5, 6],
  [7, 8, 6]
]

for (let i = 0; i < alunos.length; i++) {
let soma = 0;

  for (let j = 0; j < alunos[i].length; j++) {
    soma += alunos[i][j];
    
  }
  let media = soma / alunos[i].length;
  console.log("A média é: " + media);
}