-- O selo público "Verificado" vai passar a depender de address_verified (ver
-- mapBusiness em platform.ts), que até aqui nunca foi setado por nenhum fluxo
-- (nem o cadastro pedia comprovante, nem o admin tinha como confirmar). As
-- empresas já aprovadas foram checadas manualmente pelo admin na época, então
-- não faz sentido elas perderem o selo retroativamente por essa lacuna.
update businesses set address_verified = true where status = 'approved' and address_verified = false;
