export const AuthFooter = ({ text, linkText, onClick, loading }) => (
    <div className="mt-4 pt-4 border-t border-slate-50 text-center">
        <p className="text-[12px] text-slate-500 font-medium">
            {text}
            <button
                onClick={onClick}
                disabled={loading}
                className="text-blue-600 font-bold hover:underline ml-1 transition-all"
            >
                {linkText}
            </button>
        </p>
    </div>
);