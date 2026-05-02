# Princípios de Desenvolvimento

## Pensar antes de codar

- State assumptions explicitly. Ask if uncertain.
- Surface tradeoffs. Push back when simpler approach exists.
- Name what's confusing. Stop if unclear.

## Simplicidade

- Mínimo de código que resolve o problema.
- Sem features além do pedido.
- Sem abstrações para uso único.
- Sem flexibility/configurability não pedida.
- Se 200 linhas podem ser 50, reescreva.

## Mudanças cirúrgicas

- Toque apenas o necessário. Não "melhore" código adjacente.
- Match existing style.
- Remova apenas imports/vars que AS SUAS mudanças tornaram órfãs.
- Todo line changed deve traçar diretamente ao pedido do usuário.

## Execução orientada a objetivos

Transforme tarefas em critérios verificáveis:

```
"Add validation"  → testes para inputs inválidos → fazê-los passar
"Fix the bug"     → teste que reproduz → fazê-lo passar
"Refactor X"      → testes passam antes e depois
```

Para tarefas multi-passo:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```
