## 🚀 Live Deployment

Backend API is deployed and accessible here:

🔗 **Live URL:** https://exam-matrix-backend.onrender.com

> ⚠️ Note: Since this is hosted on Render (free tier), the server may go to sleep when idle.  
> First request may take a few seconds to respond.

# 🎓 Exam Matrix

An intelligent exam proctoring system with dual-camera monitoring, real-time AI detection, and comprehensive session management.

## 📦 Installation

### Prerequisites

- Node.js 22.x or higher
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Clone Repository

```bash
git clone https://github.com/Akshaya-somu/Exam-Matrix.git
cd Exam-Matrix
```

### Install Dependencies

```bash
npm install
```

### Environment Setup

**⚠️ IMPORTANT: Never commit your `.env` file to Git!**

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Update `.env` with your actual credentials:

```env
# Server Configuration
PORT=3000
HOST=localhost
NODE_ENV=development

# MongoDB Configuration
# Get this from MongoDB Atlas: Database > Connect > Drivers
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/exam-matrix?retryWrites=true&w=majority

# JWT Configuration
# Generate a strong secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_generated_secret_here
```

#### 🔐 Security Best Practices

1. **Generate Strong JWT Secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **MongoDB Atlas Setup:**

   - Go to MongoDB Atlas Dashboard
   - Click "Database Access" → Add user with strong password
   - Click "Network Access" → Add your IP address
   - Click "Database" → Connect → Choose "Connect your application"
   - Copy the connection string and replace `<password>` with your password

3. **Never Share:**

   - `.env` file
   - Database credentials
   - JWT secrets
   - API keys

4. **For Production:**
   - Use environment variables from your hosting provider
   - Enable SSL/TLS for MongoDB
   - Use strong, unique passwords
   - Regularly rotate secrets
   - Enable MongoDB Atlas IP whitelist
   - Use a secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)

### Database Setup

```bash
# Clear and seed database with initial data
npm run db:reset

# Or just add a live exam for testing
npm run exam:add
```

## 🔒 Security Features

- **Authentication**: JWT-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Environment Variables**: Sensitive data in .env files
- **MongoDB Security**: Connection string encryption
- **Input Validation**: Server-side validation for all inputs
- **CORS**: Configured CORS for API security
- **Rate Limiting**: (Recommended for production)
- **Helmet.js**: (Recommended for production)

## 📝 Environment Variables

| Variable     | Description               | Required | Default     |
| ------------ | ------------------------- | -------- | ----------- |
| `PORT`       | Server port               | No       | 3000        |
| `HOST`       | Server host               | No       | localhost   |
| `NODE_ENV`   | Environment mode          | No       | development |
| `MONGO_URI`  | MongoDB connection string | **Yes**  | -           |
| `JWT_SECRET` | JWT signing secret        | **Yes**  | -           |

## ⚠️ Important Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong passwords** for all accounts
3. **Rotate secrets regularly** in production
4. **Enable MongoDB Atlas IP whitelist**
5. **Use HTTPS** in production
6. **Keep dependencies updated** - Run `npm audit` regularly

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Never commit sensitive data**
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Akshaya Somu**

- GitHub: [@Akshaya-somu](https://github.com/Akshaya-somu)

## 🙏 Acknowledgments

- Built with React, Node.js, and MongoDB
- UI components from Shadcn/ui
- Real-time communication with Socket.io

---

**⚠️ Security Reminder**: Always keep your credentials secure and never share them publicly!
