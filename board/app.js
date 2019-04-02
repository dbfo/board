var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var path = require('path');


var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '1234',
    database : 'board'
})

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('views',path.join(__dirname, 'views'));
app.set('view engine','ejs');


// 질문 리스트
app.get('/',function(req,res){
    connection.query('SELECT * from post',function(err,result)
    {
        if(err){throw err}
        res.render('list',{
            data : result
        });
    })
})

//질문 올리기
app.get('/post',function(req,res){
    fs.readFile('./views/post.html','utf-8',function(err,data){
        res.send(data);
    })
})

//질문 DB에 등록
app.post('/',function(req,res){
    var body = req.body;
    var currentDate = new Date(); //use your date here
    let datetime = currentDate.toISOString().substr( 0, 10 );
    connection.query('INSERT INTO post (title,writer,content,comment,tag,views,datetime) VALUES (?,?,?,?,?,?,?)'
    ,[body.title,body.writer,body.content,0,body.tag,0,datetime],function(err,result){
        if(err) throw err;
        res.redirect('/');
    })
})

//질문 보기 & 조회수 
app.get('/page/:pageId',function(req,res){
    var filteredId = path.parse(req.params.pageId).base;
    connection.query('SELECT * from post left outer join comment on post.post_id = comment.post_id where post.post_id = ?',[filteredId],function(err,result)
    {
        connection.query('UPDATE post set views=views+1 where post_id =?',[filteredId],function(err,result2){
        if(err){throw err}
        res.render('view',{
            data : result,  
            data2 : filteredId
        });
    })
    })
})

//댓글 달기
app.post('/page/:pageId',function(req,res)
{
    var filteredId = path.parse(req.params.pageId).base;
    var body = req.body;
    connection.query('INSERT INTO comment (comment_content,post_id,comment_writer,comment_dateday) VALUES (?,?,?,now())',[body.comment_content,filteredId,body.comment_writer],function(err,result){
        connection.query('UPDATE post set comment = comment + 1 where post_id = ?',[filteredId],function(err,result2){
        if(err) throw err;
        res.redirect('/page/'+filteredId);
        })
    })
})

//수정하기
app.get('/update/:pageId',function(req,res){
    var filteredId = path.parse(req.params.pageId).base;
    connection.query('SELECT * from post left outer join comment on post.post_id = comment.post_id where post.post_id = ?',[filteredId],function(err,result)
    {
        if(err){throw err}
        res.render('update',{
            data : result
        });
    })
})

//수정한 내용 DB에 저장
app.post('/update/:pageId',function(req,res){
    var filteredId = path.parse(req.params.pageId).base;
    var body = req.body;
    connection.query('UPDATE post SET title = ?, content = ? where post_id = ?',[body.update_title, body.update_content, filteredId],function(err,result)
    {
        if(err){throw err}
        res.redirect('/page/'+filteredId);
    })
})

//질문 삭제하기
app.get('/delete/:pageId',function(req,res){
    
    connection.query('DELETE FROM post Where post_id = ?',[req.params.pageId],function(err,result){
        if(err){throw err};
        res.redirect('/');
    })

})

//댓글삭제
app.get('/comment/delete/:commentId',function(req,res){

    connection.query('SELECT post_id from comment where comment_id = ?',[req.params.commentId],function(err,result){
        var data = result;
        connection.query('DELETE FROM comment Where comment_id = ?',[req.params.commentId],function(err,result2){
           connection.query('UPDATE post set comment = comment-1 where post_id = ?',[data[0].post_id],function(err,result3){
                if(err){throw err};
                res.redirect('/page/'+result[0].post_id);
            })
        })
    })
})
//댓글 수정

var server = app.listen(8080, function(){
    console.log("hi");
})  