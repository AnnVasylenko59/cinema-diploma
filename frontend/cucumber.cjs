module.exports = {
    default: {
        paths: ['features/**/*.feature'],
        require: ['features/step_definitions/**/*.cjs', 'features/support/**/*.cjs'],
        format: ['html:cucumber-report.html'],
    }
};