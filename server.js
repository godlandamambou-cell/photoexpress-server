import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client, handle_file } from '@gradio/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/restore-ai', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "Aucune image reçue" });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

    // Passer le jeton Hugging Face s'il est disponible dans .env
    const clientOptions = process.env.HF_TOKEN ? { hf_token: process.env.HF_TOKEN } : {};
    const client = await Client.connect("sczhou/CodeFormer", clientOptions);
    
    const result = await client.predict("/inference", {
      image: handle_file(imageBlob),
      background_enhance: true,
      face_upsample: true,
      upscale: 2,
      codeformer_fidelity: 0.7
    });

    const restoredUrl = result.data?.[0]?.url || result.data?.[0];

    res.json({ success: true, restoredImageUrl: restoredUrl });
  } catch (error) {
    console.error("Erreur Hugging Face:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Serveur API IA démarré sur http://localhost:${port}`);
});