<?php
// SERVER-SIDE order placement. Browser may only send product_id => quantity.
function place_order(PDO $pdo,int $customer_id,array $items,array $info):string{
  if(!$items) throw new Exception('Cart is empty');
  $pdo->beginTransaction();
  try{
    $subtotal=0;$disc=0;$lines=[];
    foreach($items as $pid=>$qty){
      $pid=(int)$pid;$qty=(int)$qty; if($qty<1) throw new Exception('Invalid quantity');
      $s=$pdo->prepare('SELECT p.*,i.quantity stock FROM products p JOIN inventory i ON i.product_id=p.id
                        WHERE p.id=? AND p.status="active" FOR UPDATE');   // row lock prevents overselling
      $s->execute([$pid]);$p=$s->fetch();
      if(!$p) throw new Exception('Product unavailable');
      if($p['stock']<$qty) throw new Exception($p['name'].' has insufficient stock');
      $gross=$p['price']*$qty;$d=round($gross*$p['discount_percent']/100,2);
      $subtotal+=$gross;$disc+=$d;$lines[]=[$p,$qty,$gross-$d];
    }
    $total=$subtotal-$disc;
    $no='AV-'.date('Ymd').'-'.strtoupper(bin2hex(random_bytes(3)));
    $fulf=($info['fulfillment']??'delivery')==='pickup'?'pickup':'delivery';
    $pdo->prepare('INSERT INTO orders(order_number,customer_id,fulfillment,recipient,contact,delivery_address,install_date,notes,subtotal,discount_total,total)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?)')
        ->execute([$no,$customer_id,$fulf,$info['recipient'],$info['contact'],$info['address']??null,$info['install_date']?:null,$info['notes']??'',$subtotal,$disc,$total]);
    $oid=$pdo->lastInsertId();
    foreach($lines as [$p,$qty,$lt]){
      $pdo->prepare('INSERT INTO order_items(order_id,product_id,product_name,unit_price,discount_percent,quantity,line_total) VALUES(?,?,?,?,?,?,?)')
          ->execute([$oid,$p['id'],$p['name'],$p['price'],$p['discount_percent'],$qty,$lt]);
      $pdo->prepare('UPDATE inventory SET quantity=quantity-? WHERE product_id=?')->execute([$qty,$p['id']]);
      $pdo->prepare('INSERT INTO stock_movements(product_id,type,qty_change,reference) VALUES(?,"online_order",?,?)')->execute([$p['id'],-$qty,$no]);
    }
    // COD only. Order = 'pending', payment = 'unpaid': the sale is NOT complete yet.
    $pdo->prepare('INSERT INTO payments(order_id,method,amount,status) VALUES(?,"cod",?,"unpaid")')->execute([$oid,$total]);
    $pdo->commit();return $no;
  }catch(Throwable $x){$pdo->rollBack();throw $x;}
}
// Final availability check is the UNIQUE slot_key in the DB, so double booking is impossible even under race conditions.
function book_appointment(PDO $pdo,int $request_id,string $date,string $time):bool{
  try{ $pdo->prepare('INSERT INTO appointments(service_request_id,appt_date,appt_time,slot_key) VALUES(?,?,?,?)')
         ->execute([$request_id,$date,$time,"$date $time"]); return true;
  }catch(PDOException $x){ if($x->getCode()==23000) return false; throw $x; }
}
