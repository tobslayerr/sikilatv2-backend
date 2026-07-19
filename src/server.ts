import app from './app';

// Gunakan port dari Environment Variable (Disediakan otomatis oleh Railway)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});