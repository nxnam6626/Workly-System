import fs from 'fs';

const filePath = 'd:\\DOAN_DUYTIEN\\2\\Workly-System\\server\\src\\modules\\ai\\ai-insights.service.ts';
let code = fs.readFileSync(filePath, 'utf-8');

const lines = code.split('\n');

let fallbackLoopStartIdx = -1;
let innerIfEndIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('for (const job of jobsForAnalysis) {') && lines[i-1].includes('4.5 Fallback: Ensure all jobs have a score')) {
    fallbackLoopStartIdx = i;
  }
  if (fallbackLoopStartIdx > -1 && i > fallbackLoopStartIdx && lines[i].includes('      const stats = {')) {
    innerIfEndIdx = i - 1; // This is where the '}' for the inner if is
    break;
  }
}

if (fallbackLoopStartIdx > -1 && innerIfEndIdx > -1) {
  // Insert a closing bracket for the for loop right after innerIfEndIdx
  lines.splice(innerIfEndIdx + 1, 0, '    }');
  
  // Now we need to remove the matching extra '}' at the end of the file.
  // We know the end of the file looks like:
  //       return fallbackPayload;
  //     } // this one
  //   }
  // }
  
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i] === '    }') {
      lines.splice(i, 1);
      break;
    }
  }

  // Now, unindent everything from the new '    }' down to the end of the file
  let startUnindent = innerIfEndIdx + 2;
  for (let i = startUnindent; i < lines.length - 2; i++) {
    if (lines[i].startsWith('  ')) {
      lines[i] = lines[i].substring(2);
    }
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  console.log("File successfully re-bracketed and unindented!");
} else {
  console.log("Could not find targets");
}
