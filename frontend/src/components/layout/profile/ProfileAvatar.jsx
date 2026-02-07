import React from "react";

export const ProfileAvatar = ({ user, className = "w-10 h-10", initialsClass = "text-sm" }) => {
    const initials = user?.name
        ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    return (
        <div className={`${className} rounded-xl overflow-hidden flex items-center justify-center font-bold shadow-inner`}>
            {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center">
                    <span className={initialsClass}>{initials}</span>
                </div>
            )}
        </div>
    );
};