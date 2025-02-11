const jwt = require('jsonwebtoken');

const requireAuth = (allowedRole) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            jwt.verify(token, process.env.SECRET, (err, decodedToken) => {
                if (err) {
                    res.locals.user_id = null;
                    res.locals.user_role=null;
                    res.status(401).json({ message: 'Please enter correct email and password' });  
                } else {
                    if (allowedRole == decodedToken.role) {
                        res.locals.user_id = decodedToken.id;
                        res.locals.user_role=decodedToken.role;
                        next();
                    } else {
                        return res.status(403).json({ message: 'Forbidden: You do not have access to this resource' });
                    }
                }
            });
        }
        else {
            res.locals.user_id = null;
            res.locals.user_role=null;

            res.status(401).json({ message: 'Unauthorized' });
        }
    }
}


module.exports = { requireAuth };