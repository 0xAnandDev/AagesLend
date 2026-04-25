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

    content = content.replace(/bg-grey-light/g, 'bg-gray-200');
    content = content.replace(/bg-grey/g, 'bg-white');
    content = content.replace(/shadow-grey-light/g, 'shadow-white');
    content = content.replace(/shadow-grey/g, 'shadow-white');
    content = content.replace(/border-grey-light/g, 'border-gray-200');
    content = content.replace(/border-grey/g, 'border-white');
    
    if(content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
    }
});
