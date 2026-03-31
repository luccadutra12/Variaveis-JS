  //❌ Código ruim
  let a = [1, 2, 3]
  let s = 0
  
  for (let i = 0; i < a.length; i++) {
    s += a[i]
  }
  console.log(s/a.length)

  //✅ Código limpo
  let notas = [1, 2, 3]

  let soma = 0

  for (let i = 0; i < notas.length; i++) {
  soma += notas[i];
  }     
  let media = (soma/notas.length);

  console.log("Média: " , media);
