#!/usr/bin/env bash
set -euo pipefail

# 1) List your 11 baby IDs here:
baby_ids=(
  22d23c60-ac66-498d-9f77-2d904ceb002d
    c8c61696-fcd3-4443-899a-6ad8f1c86cf9
    68260dfce4061d9244e928fa
    68260f0ee4061d9244e929f3
    bd3a0b85-017b-44a5-a5b2-888f3c4ec011
    68286c90dc87853724787609
    68304d92b5b1b546a3e74491
    6830495de1f8c5b3c1a7702e
    68275428dc878537247875d7
    68260b8be4061d9244e9289d
    68263a41fd76ebbe79e32a59
)

TABLE="babies"

for babyId in "${baby_ids[@]}"; do
  echo "→ Ensuring administered attribute exists on babyId=${babyId}"
  aws dynamodb update-item \
    --table-name "$TABLE" \
    --key "{\"babyId\": {\"S\": \"${babyId}\"} }" \
    --update-expression "SET administered = if_not_exists(administered, :empty_list)" \
    --expression-attribute-values '{ ":empty_list": { "L": [] } }'
done

echo "✅ All done."
