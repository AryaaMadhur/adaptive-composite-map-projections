/*globals GraticuleOutline*/
function TransformedLambertAzimuthalTransverse() {
    "use strict";
    var lat0 = 0,
            m, n, CA, CB,
            // scale factor along central meridian
            k0 = 1;

    this.toString = function () {
        return 'Transformed Lambert Azimuthal Transverse';
    };

    this.isEqualArea = function () {
        return true;
    };

    this.initialize = function (conf, w) {
        lat0 = 0; // conf.lat0;

        var lam1, phi1, p, k, d, pCyl, w_;

        /*
         linear blending
         lam1 = w * Math.PI;
         phi1 = w * Math.PI / 2;
         
         // convert standard parallel to aspect ratio p
         pCyl = Math.PI * Math.cos(lat0) * Math.cos(lat0);
         p = pCyl + (1.4142135623730950488016887242097 - pCyl) * w;
         */

        // non-linear blending
        w_ = 1 - Math.cos(Math.PI / 2 * w);
        phi1 = w_ * Math.PI / 2;
        lam1 = Math.atan(w) * 4;

        // convert standard parallel to aspect ratio p
        pCyl = Math.PI * Math.cos(lat0) * Math.cos(lat0);
        p = pCyl + (Math.sqrt(2) - pCyl) * w_;

        lam1 = Math.max(lam1, 0.0000001);
        phi1 = Math.max(phi1, 0.0000001);

        m = Math.sin(phi1);
        n = lam1 / Math.PI;
        k = Math.sqrt(p * Math.sin(phi1 / 2) / Math.sin(lam1 / 2));
        d = Math.sqrt(m * n);
        CA = k / d;
        CB = 1 / (k * d);
    };

    this.forward = function (lon, lat, xy) {
        var sin_O, cos_O, d, cosLon, cosLat, sinLat;

        // transverse rotation
        lon += Math.PI / 2;
        cosLon = Math.cos(lon);
        cosLat = Math.cos(lat);
        // Synder 1987 Map Projections - A working manual, eq. 5-10b with alpha = 0
        lon = Math.atan2(cosLat * Math.sin(lon), Math.sin(lat));
        // Synder 1987 Map Projections - A working manual, eq. 5-9 with alpha = 0
        sinLat = -cosLat * cosLon;

        // transformed Lambert azimuthal
        lon *= n;
        sin_O = m * sinLat;
        cos_O = Math.sqrt(1 - sin_O * sin_O);
        d = Math.sqrt(2 / (1 + cos_O * Math.cos(lon)));
        // invert x and y and flip y coordinate
        xy[1] = -CA * d * cos_O * Math.sin(lon);
        xy[0] = CB * d * sin_O;
    };

    this.inverse = function (x, y, lonlat) {
        // code courtesy by Bojan Savric
        
        var z, sinLat, cosLat, cosLon, lon;

        // inverse transformed Lambert azimuthal
        x /= CB;
        y /= -CA;
        z = Math.sqrt(1 - 0.25 * (x * x + y * y));

        lon = Math.atan2(z * y, 2 * z * z - 1) / n;
        sinLat = z * x / m;
        cosLat = Math.sqrt(1 - sinLat * sinLat);

        // inverse transverse rotation
        cosLon = Math.cos(lon);
        // Synder 1987 Map Projections - A working manual, eq. 5-10b with alpha = 0
        lon = Math.atan2(cosLat * Math.sin(lon), -sinLat);
        // Synder 1987 Map Projections - A working manual, eq. 5-9 with alpha = 0
        sinLat = cosLat * cosLon;

        lonlat[0] = lon - Math.PI / 2;
        lonlat[1] = Math.asin(sinLat);
    };

    this.getOutline = function () {
        return GraticuleOutline.genericOutline(this);
    };

    this.getShaderUniforms = function () {
        var uniforms = [];
        uniforms.projectionID = this.getID();
        uniforms.wagnerM = m;
        uniforms.wagnerN = n;
        uniforms.wagnerCA = CA;
        uniforms.wagnerCB = CB;
        uniforms.falseNorthing = -lat0;
        return uniforms;
    };

    this.getID = function () {
        // minus sign for transverse
        return -777;
    };
}