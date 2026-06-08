const WhatsAppButton = () => {
  const estiloBoton = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '50px',
    height: '50px',
    backgroundColor: '#082EB7',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    textDecoration: 'none',
    zIndex: 1000,
  };

  const estiloIcono = {
    width: '28px',
    height: '28px',
  };

  return (
    <a
      href="https://api.whatsapp.com/send/?phone=51997626315&text&type=phone_number&app_absent=0"
      target="_blank"
      rel="noopener noreferrer"
      style={estiloBoton}
    >
      <img
        src="src\assets\imagenes\icons8-whatsapp.svg"
        alt="WhatsApp"
        style={estiloIcono}
      />
    </a>
  );
};

export default WhatsAppButton;