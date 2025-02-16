import '../../css/reset.css';
import '../../css/index.css';

// Export showHelpBox for global use
window.showHelpBox = function(show) {
    const helpBox = document.getElementById("help-box");
    if (show) {
        helpBox.classList.remove("hidden");
    }
    else {
        helpBox.classList.add("hidden");
    }
};

// Show help box for first time
const helpBox = document.getElementById("help-box");
if (!localStorage["iamnop.particles.helpShown"]) {
    helpBox.classList.remove("hidden");
    localStorage["iamnop.particles.helpShown"] = true;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Particle Dream initialized');
    window.app = new App();
});