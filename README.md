# Guia de Liberação de Superfícies Pintadas

Aplicação interativa para apoiar a inspeção de superfícies pintadas. O guia organiza classes de superfície, critérios de visibilidade, defeitos, exemplos fotográficos e a decisão de liberação com base na STD 120-0014 e nas instruções de trabalho do processo.

## Recursos

- Navegação por seções com botões, teclado e deslize no celular.
- Classificação visual das superfícies e prévia da posição da peça na máquina.
- Matriz de defeitos com classes 1A, 1B, 2A, 2B, 3 e 4.
- Consulta simplificada por visibilidade, quantidade e faixas de milímetros.
- Resultado de liberar, liberar condicionado, avaliar ou não liberar.
- Galeria de exemplos para contaminação, falha de cobertura, desplacamento, ferrugem, fervura e sujeira.
- Layout responsivo para desktop e celular.

## Tecnologias

- React
- Vite
- Lucide React
- CSS responsivo

## Executar localmente

```bash
npm install
npm run dev
```

Para criar a versão de produção:

```bash
npm run build
```

## Estrutura

```text
src/App.jsx          Componentes, estados e regras da consulta
src/styles.css       Estilos visuais base
src/interactions.css Navegação por slides e responsividade
src/main.jsx         Ponto de entrada da aplicação
img/                 Imagens das classes e exemplos de defeitos
normas/              Documentos técnicos de referência
```

## Referências técnicas

- Volvo STD 120-0014 — Requisitos de superfícies pintadas.
- Volvo STD 120-0015 — Requisitos de substratos metálicos.
- IT 177 — Procedimento padrão do setor de pintura.

As consultas do guia facilitam a triagem. A liberação final deve respeitar a ordem de produção, o desenho técnico, as especificações aplicáveis e a avaliação da Qualidade.
