const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");`;

const replaceStr = `  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Photo handler added.");
} else {
  console.log("Target string not found.");
}
