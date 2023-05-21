import axios from 'axios';

const BASE_URL = 'https://next.textus.com';

export const sendText = async (token: string, ownerEmail: string, phoneNumber: string, message: string) => {
  await axios.post(
    `${BASE_URL}/messages`,
    {
      to: `+1${phoneNumber.replaceAll('-', '')}`,
      body: message,
      email: ownerEmail,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.textus+jsonld',
        'Content-Type': 'application/vnd.textus+jsonld',
      },
    }
  );
};
