const { readFileSync } = require("fs");
const wallpapers = require("./wallpapers");

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', async () => {
  
  let done = false;
  const stdout = [];
  const settings = JSON.parse(readFileSync('settings.json'));
  let { apps, folders, splashImage, wallpaper, wallpaperTerm } = settings;

  if (wallpapers[wallpaper]) {
    let results = await wallpapers[wallpaper](0, 0, false, wallpaperTerm);
    wallpaper = await wallpapers.fullImage(results[0]);
  }

  const term = document.getElementById('term');
  const clock = document.getElementById('clock');
  const screen = document.getElementById('screen');
  const splash = document.getElementById('splash');
  const desktop = document.getElementById('desktop');
  const taskbar = document.getElementById('taskbar');

  // Replace console with the terminal
  console.clear = () => { term.value = ''; };
  console.log = (...output) => { stdout.push(output.join(' ')); };

  const tty = () => {    
    const write = output => { setTimeout(() => { term.value += `${output}\n`}, output.length * 100); };

    setInterval(() => {
      let output = stdout.shift();
      if (output) write(output);      
    }, 100);
  };
  
  const blink = (max) => { 
    let count = 0;
    let blinker = setInterval(() => {
      if (count == max) {
        done = true;
        console.clear();
        clearInterval(blinker);
        return;
      }
      console.log('_');
      console.clear();
      count++;
   }, 1500);
  };
  
  const setBackground = image => {
    screen.style.background = '#000';
    screen.style.background = `url(${image})`;
    screen.style.backgroundSize = 'cover';
  };

  const startClock = () => {
    setInterval(() => {
      clock.innerText = new Date().toLocaleString();
    }, 1000);
  };

  const icon = url => `https://icons.duckduckgo.com/ip3/${url}.ico`;

  const appIcon = ({ name, url }) => `<li class='icon' title='${name}' onclick='javascript:window.open("http://${url}", "_blank");'>
    <a href='#'>
      <img src='${icon(url)}'/>
    </a>
  </li>`;

  const createFolder = ({ name, children }) => `<ul class='folder'>
    ${children.map(appIcon).join('')}
    <label>${name}</label>
  </ul>
  `;

  const loadApps = (apps) => {
    apps.forEach(app => {
      taskbar.innerHTML += appIcon(app);
    });
  };

  const loadFolders = (folders) => {
    folders.forEach(folder => {
      desktop.innerHTML = createFolder(folder) + desktop.innerHTML;
    });
  };

  const loadDesktop = () => {
    setTimeout(() => {
      splash.style.opacity = 0;
      setTimeout(() => {
        desktop.style.opacity = 1;
        setBackground(wallpaper);
        taskbar.style.height = '60px';
        startClock();
        loadApps(apps);
        loadFolders(folders);
        done = true;
      }, 3000);
    }, 10000);
  };

  const startGraphicalServer = () => {       
    setTimeout(() => {
      term.style.display = 'none';
      setBackground(splashImage);
      setTimeout(() => {
        splash.style.opacity = 1;
        done = true;
      }, 3000);
      then(() => loadDesktop());
    }, 5000); 
  };

  const then = callback => {
    let awaiter = setInterval(() => { 
      if (done) { 
        callback(); 
        clearInterval(awaiter); 
      } 
    }, 100);
  };

  const boot = () => {    
    tty();
    blink(1);
    then(() => {
      console.log('Loading...');
      console.log('Initializing system');
      console.log('Configuring display settings');
      console.log('Starting graphical server');
      done = true;
      then(() => startGraphicalServer());
    });
  };
  
  boot();
});
