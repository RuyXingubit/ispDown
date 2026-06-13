package utils

import (
	"regexp"
	"strconv"
)

var reOnlyDigits = regexp.MustCompile(`\D`)

// ValidateCPF verifica se o CPF é matematicamente válido segundo o algoritmo da Receita Federal.
// Aceita CPF com ou sem formatação (pontos e hífen).
func ValidateCPF(cpf string) bool {
	// Remove qualquer caractere que não seja dígito
	digits := reOnlyDigits.ReplaceAllString(cpf, "")

	// Deve ter exatamente 11 dígitos
	if len(digits) != 11 {
		return false
	}

	// Rejeita sequências de dígitos iguais (ex: 111.111.111-11)
	allSame := true
	for _, ch := range digits[1:] {
		if ch != rune(digits[0]) {
			allSame = false
			break
		}
	}
	if allSame {
		return false
	}

	// Converte cada caractere em inteiro
	nums := make([]int, 11)
	for i, ch := range digits {
		nums[i], _ = strconv.Atoi(string(ch))
	}

	// Valida primeiro dígito verificador
	sum := 0
	for i := 0; i < 9; i++ {
		sum += nums[i] * (10 - i)
	}
	remainder := sum % 11
	firstDigit := 0
	if remainder >= 2 {
		firstDigit = 11 - remainder
	}
	if nums[9] != firstDigit {
		return false
	}

	// Valida segundo dígito verificador
	sum = 0
	for i := 0; i < 10; i++ {
		sum += nums[i] * (11 - i)
	}
	remainder = sum % 11
	secondDigit := 0
	if remainder >= 2 {
		secondDigit = 11 - remainder
	}
	return nums[10] == secondDigit
}
