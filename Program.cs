using BookingApp.Data;
using BookingApp.Models;
using BookingApp.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=booking.db"));

builder.Services.AddScoped<BookingService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();
app.UseDefaultFiles();
app.UseStaticFiles();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.Migrate();

    // 👉 ДОБАВЛЯЕМ БИЗНЕС
    if (!context.Businesses.Any())
    {
        var business = new Business
        {
            Name = "Test Barber",
            Slug = "barber",
            Username = "admin",
            Password = "1234"
        };

        context.Businesses.Add(business);
        context.SaveChanges();
    }

    // 👉 получаем бизнес
    var firstBusiness = context.Businesses.First();

    // 👉 теперь создаём работников
    if (!context.Workers.Any())
    {
        var worker1 = new Worker { Name = "Artem", BusinessId = firstBusiness.Id };
        var worker2 = new Worker { Name = "Andrii", BusinessId = firstBusiness.Id };

        context.Workers.AddRange(worker1, worker2);
        context.SaveChanges();

        context.Services.AddRange(
            new Service
            {
                Name = "Haircut",
                DurationMinutes = 60,
                Price = 80,
                WorkerId = worker1.Id,
                BusinessId = firstBusiness.Id
            },
            new Service
            {
                Name = "Beard Trim",
                DurationMinutes = 30,
                Price = 40,
                WorkerId = worker1.Id,
                BusinessId = firstBusiness.Id
            },
            new Service
            {
                Name = "Consultation",
                DurationMinutes = 45,
                Price = 100,
                WorkerId = worker2.Id,
                BusinessId = firstBusiness.Id
            }
        );

        context.SaveChanges();
    }
}

app.Run();