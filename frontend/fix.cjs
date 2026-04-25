const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.jsx') || file.endsWith('.js')) results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Headings replacement: Replace text-grey-light with text-white
    content = content.replace(/text-grey-light/g, 'text-white');
    content = content.replace(/text-grey/g, 'text-gray-300');
    
    // Remove opacity-50, 60, 70 unless it's disabled:opacity-50 or hover:opacity-50
    content = content.replace(/(?<!hover:|disabled:|group-hover:)\bopacity-[567]0\b/g, '');

    // For specific headings with text-gray-400 or 500
    content = content.replace(/(<h[1-6][^>]*className=["'][^"']*)text-gray-[45]00([^"']*["'])/g, '\$1text-white\$2');
    
    // Also card titles, section titles often use text-gray-400
    // Let's replace some known patterns like `text-gray-400` in specific headers manually if needed.
    // For now this does general opacity removal and fixes `text-grey`.
    
    if(content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
    }
});
