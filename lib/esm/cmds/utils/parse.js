export var parseTo = function (to) {
    var split = String(to).split(":");
    var TO_PROTOCOL = "http";
    var TO_HOST = "localhost";
    var TO_PORT = 80;
    switch (split.length) {
        case 1:
            if (!isNaN(Number(split[0]))) {
                TO_PORT = Number(split[0]);
            }
            else {
                TO_HOST = split[0];
            }
            break;
        case 2:
            if (isNaN(Number(split[1]))) {
                TO_PROTOCOL = split[0];
                TO_HOST = split[1];
            }
            else {
                TO_HOST = split[0];
                TO_PORT = Number(split[1]);
            }
            break;
        case 3:
            TO_PROTOCOL = split[0];
            TO_HOST = split[1];
            TO_PORT = Number(split[2]);
            break;
        default:
            break;
    }
    if (TO_PROTOCOL === "https") {
        TO_PORT = 443;
    }
    return {
        TO_PROTOCOL: TO_PROTOCOL,
        TO_HOST: TO_HOST.replace("//", ""),
        TO_PORT: Number(TO_PORT),
    };
};
