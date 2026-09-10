# Dropmac

Landing page interativa para revenda de MacBooks, em português, feita com HTML, CSS e JavaScript sem dependências de aplicação.

## Recursos

- Tema claro e escuro com preferência salva no navegador.
- Catálogo de MacBook Pro 2017, Pro 2019, Air M1 e Air M2.
- Detalhes em modal, galerias e visualizadores externos 360° do Sketchfab, quando disponíveis.
- Comparação de especificações e benchmarks com fontes na página.
- Simulador de orçamento, economia mensal e tempo até outro modelo.
- Redirecionamento configurável para ofertas na Nuvemshop ou Shopify.

## Executar

Abra `index.html` no navegador. Os modelos 360° e os links externos precisam de internet.

Para servir por HTTP, com Python instalado:

```sh
python -m http.server 8080
```

Acesse `http://localhost:8080`. Não é necessário instalar pacotes ou compilar.

## Editar

| Arquivo | Finalidade |
| --- | --- |
| `index.html` | Estrutura, conteúdo e fontes das comparações |
| `style.css` | Layout, animações, responsividade e temas |
| `app.js` | Catálogo interativo, gráficos, modais e simulador |
| `catalog.js` | Dados dos modelos, preços e imagens |
| `decision.js` | Regras do planejamento de compra |
| `theme.js` | Preferência claro/escuro |
| `store-config.js` | Links reais de compra por modelo |
| `assets/` | Imagens ilustrativas dos modelos |

## Conectar a loja

Preencha apenas URLs HTTPS reais dos produtos em `store-config.js`. As chaves são `pro2017`, `pro2019`, `m1` e `m2`. Os links estão vazios intencionalmente enquanto a loja é preparada. Não existe processamento de pagamentos nem backend neste projeto.

## Dados e conteúdo comercial

Preços informados pela Dropmac em 10/09/2026: Pro 2017 a partir de R$ 1.900; Pro 2019 a partir de R$ 2.400; M1 a partir de R$ 3.200. O M2 ainda não tem preço informado. Valores comparativos de marketplaces são referências fornecidas pela loja, não uma coleta automática de anúncios.

Confira configuração, estoque, conservação, fotos da unidade, bateria e garantia antes de publicar ofertas. As fotos atuais ilustram os modelos; não documentam as unidades em estoque. Os resultados do simulador são sugestões baseadas nas regras indicadas, não previsões ou garantias de desempenho.

Os benchmarks e as especificações possuem links de referência na página. Resultados pertencem às configurações testadas; não devem ser estendidos a outras versões. Consulte também `THIRD_PARTY_NOTICES.md`.

## Hospedagem

Este diretório pode ser servido por qualquer hospedagem estática. Use a raiz como diretório de publicação, sem comando de build. Criar o repositório não ativa automaticamente uma hospedagem pública do site.

## Verificação local

Com Node.js instalado, execute `node check.mjs` para verificar sintaxe dos scripts e existência das imagens e referências locais.
