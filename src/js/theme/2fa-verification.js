const twoFAVerificarionInit = () => {
  const verificationForm = document.querySelector('[data-2fa-form]');
  // The boxes are type=text/data-lhb-code now — a number input drops leading zeros
  // and shows spinners on a one-character field. type=number is kept as a fallback
  // for any page still on the original markup.
  const inputFields = verificationForm?.querySelectorAll(
    'input[data-lhb-code], input[type=number]'
  );
  const varificationBtn = verificationForm?.querySelector(
    '[data-lhb-auth-submit], button[type=submit]'
  );

  if (verificationForm && inputFields?.length && varificationBtn) {
    window.addEventListener('load', () => inputFields[0].focus());
    const totalInputLength = 6;
    inputFields.forEach((input, index) => {
      input.addEventListener('keyup', e => {
        const { value } = e.target;
        if (value) {
          [...value].slice(0, totalInputLength).forEach((char, charIndex) => {
            if (inputFields && inputFields[index + charIndex]) {
              inputFields[index + charIndex].value = char;
              inputFields[index + charIndex + 1]?.focus();
            }
          });
        } else {
          inputFields[index].value = '';
          inputFields[index - 1]?.focus();
        }
        const inputs = [...inputFields];
        const updatedOtp = inputs.reduce(
          (acc, inputData) => acc + (inputData?.value || ''),
          ''
        );
        if (totalInputLength === updatedOtp.length) {
          varificationBtn.removeAttribute('disabled');
        } else {
          varificationBtn.setAttribute('disabled', true);
        }
      });
    });
  }
};

export default twoFAVerificarionInit;
