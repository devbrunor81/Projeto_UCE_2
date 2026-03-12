# Projeto_UCE_2

**Tipos de Usuário do Sistemas:**

* Usuário Administrador (Coordenação):  
  * Faz login e interage diretamente com o CRUD de itens do banco.

* Usuário Comum:  
  * Apenas visualiza os itens no catálogo

**Banco de dados e catálogo:**

* Os itens são salvos no banco com informações: imagem, nome, descrição(opcional), categoria, data de encontro, retirado(flag booleana), nome_resgatante, matrícula_resgatante
  
* Para retirar um item, é necessário vincular informações de quem o retirou, como nome, matrícula ou e-mail.  

* O site pode exibir tanto os itens perdidos e os retirados

**Permissões do Administrador:**

* Fazer Login e Logout  
* Adicionar item ao estoque de itens  
* Visualizar item no estoque de itens  
* Editar item no estoque de itens  
* Marcar um item como “retirado”, ocultando-o do catálogo de itens disponíveis (Utiliza rastreabilidade vinculando informações da pessoa que retirou o item)  
* Visualizar itens na aba de “retirados”  
* Excluir totalmente o item do banco (Exclusão direta, sem rastreabilidade)

**Fluxo ideal de uso da aplicação:**

1. Coordenação recebe item  
2. Usuário Administrador faz o registro do item no estoque  
3. Usuário Comum acessa o site e vê o catálogo  
4. Usuário Comum vai presencialmente até a coordenação para retirar o item  
5. Usuário Administrador marca o item como “retirado”, adicionando as informações de quem retirou o item.
