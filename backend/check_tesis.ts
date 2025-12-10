
import { dbGet } from './src/config/database';

async function checkTesisCount() {
    try {
        const result = await dbGet('SELECT COUNT(*) as count FROM tesis_referencias', []);
        console.log(`Total tesis_referencias: ${result.count}`);
    } catch (error) {
        console.error('Error checking tesis count:', error);
    }
}

checkTesisCount();
