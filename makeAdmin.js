const mongoose = require('mongoose');
const userModel = require('./models/userModel');

const nomeBD = 'projetoEW';
const mongoHost = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`;

function parseArgs() {
    const args = process.argv.slice(2);
    const identifier = args[0];

    let role = 'admin';
    const roleArg = args.find(arg => arg.startsWith('--role='));
    if (roleArg) {
        role = roleArg.split('=')[1] || role;
    }

    return { identifier, role };
}

async function main() {
    const { identifier, role } = parseArgs();

    if (!identifier) {
        console.error('Usage: node makeAdmin.js <username-or-email> [--role=admin|docente|aluno]');
        process.exit(1);
    }

    const normalized = identifier.trim().toLowerCase();

    await mongoose.connect(mongoHost);

    const user = await userModel.findOne({
        $or: [
            { email: normalized },
            { username: normalized }
        ]
    });

    if (!user) {
        console.error('User not found.');
        await mongoose.disconnect();
        process.exit(1);
    }

    user.role = role;
    await user.save();

    console.log(`User ${user.username} updated to role: ${user.role}`);
    await mongoose.disconnect();
}

main().catch(async error => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
